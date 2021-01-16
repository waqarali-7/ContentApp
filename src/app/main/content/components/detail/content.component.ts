import { updateContent } from './../../store/actions/content.action';
import { MODULE_CONFIG } from './../../constants/editor.const';
import { ContentTextBlockState } from './../../store/states/content-text-block.state';
import { getContent } from '../../store/actions/content.action';
import { ContentTextBlock } from './../../models/content-text-blocks';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { fuseAnimations } from '@fuse/animations';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

@Component({
    selector: 'content',
    templateUrl: './content.component.html',
    styleUrls: ['./content.component.scss'],
    animations: fuseAnimations,
    encapsulation: ViewEncapsulation.None
})
export class ContentComponent implements OnInit {
    @Select(ContentTextBlockState.getContentTextBlockList) contentTextBlocks: Observable<ContentTextBlock[]>;
    @Select(ContentTextBlockState.getTotalContentTextBlock) total: Observable<number>;
    @Select(ContentTextBlockState.updateContentBlock) updateContent: Observable<ContentTextBlock>;
    public modules = MODULE_CONFIG;
    public selectedBlock: ContentTextBlock = null;
    public defaultPageSize = 4;
    public pageNo = 1;
    public totalCount = 0;
    private contentID: string;
    private contentBlocks: ContentTextBlock[];
    private selectedIndex: number;
    private horizontalPosition: MatSnackBarHorizontalPosition = 'end';
    private verticalPosition: MatSnackBarVerticalPosition = 'top';

    constructor(private store: Store, private actRoute: ActivatedRoute, private _snackBar: MatSnackBar) {
        this.contentID = this.actRoute.snapshot.params.id;
        this.contentTextBlocks.subscribe((contentBlocks) => {
            this.contentBlocks = contentBlocks;
            this._snackBar.open('Text-blocks fetched successfully', 'x', {
                duration: 2000,
                horizontalPosition: this.horizontalPosition,
                verticalPosition: this.verticalPosition,
            });
        })
        this.total.subscribe((total) => {
            this.totalCount = total;
        })
    }

    ngOnInit() {
        this.fetchContentBlockList();
        this.updateContent.subscribe((block) => {
            if (!block) return;
            this._snackBar.open('Text-block updated successfully', 'x', {
                duration: 2000,
                horizontalPosition: this.horizontalPosition,
                verticalPosition: this.verticalPosition,
            });
        })
    }

    public editItem(id: string) {
        this.selectedIndex = this.contentBlocks.findIndex(contentBlock => contentBlock.id === id);
        this.selectedBlock = this.contentBlocks[this.selectedIndex];
    }

    public contentUpdate($event) {

        if ($event !== undefined) {
            this.store.dispatch(new updateContent($event, this.selectedBlock.id, this.selectedIndex));
        }

        this.selectedBlock = null;
    }

    public loadMoreContentBlocks() {
        this.pageNo++;
        this.store.dispatch(new getContent(this.contentID, `?pageSize=${this.defaultPageSize}&page=${this.pageNo}`));
    }


    private fetchContentBlockList() {
        this.store.dispatch(new getContent(this.contentID, `?pageSize=${this.defaultPageSize}&page=${this.pageNo}`, true));
    }

}
